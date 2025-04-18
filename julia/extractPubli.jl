using Pkg
Pkg.activate(".")
Pkg.instantiate()
using PyCall
using DataFrames
using YAML
using HTTP
using Conda
Conda.add("gdefazio::pyalex")
pyalex = pyimport("pyalex")
# pyalex.config.email = "quentin.glorieux@lkb.upmc.fr"

function get_openalex_id(input_identifier::String)
    authors = pyalex.Authors()
    if occursin("0-", input_identifier)  # Assuming it's an ORCID number
        orcid_url = "https://orcid.org/$input_identifier"
        openalex_url = authors[orcid_url]["id"]
    else
        name_result = authors.search_filter(display_name=input_identifier).get()
        openalex_url = name_result[1]["id"]
    end

    match = match(r"A(\d+)", openalex_url)
    if match !== nothing
        return "A" * match.captures[1]
    else
        return nothing
    end
end

function df_creation(openalex_id::String)
    works = pyalex.Works()
    pager = works |> filter(author=Dict("id" => openalex_id)) |>
                  filter(has_doi=true, primary_location=Dict("source" => Dict("has_issn" => true))) |>
                  select(["id", "doi", "title", "publication_year", "ids", "type", "type_crossref", "open_access", "primary_location", "authorships", "biblio", "concepts"]) |>
                  sort(publication_year="desc") |>
                  paginate(per_page=100)
    
    list = []
    for page in pager
        append!(list, page)
    end
    df = DataFrame(list)
    return df
end

function extract_info(row)
    match = match(r"physrev(.+?)(\d+)", row["doi"])
    journal_abbreviation = ""
    if match !== nothing
        if !(match.captures[1][1] in ['l', 'r', 'x'])
            if row["primary_location"]["source"]["display_name"][end] != uppercase(match.captures[1][1])
                journal_abbreviation = uppercase(match.captures[1][1])
            end
        end
    end

    return Dict(
        "title" => row["title"],
        "authors" => [Dict("name" => entry["author"]["display_name"], "orcid" => entry["author"]["orcid"]) for entry in row["authorships"]],
        "link" => Dict(
            "url" => row["doi"],
            "display" => row["primary_location"]["source"]["display_name"] * " " * string(row["biblio"]["volume"]) * " " * string(row["biblio"]["issue"]) * " (" * string(row["publication_year"]) * ")."
        ),
        "doi" => row["doi"],
        "is_oa" => row["open_access"]["is_oa"],
        "oa_url" => row["open_access"]["oa_url"],
        "publication_year" => row["publication_year"],
        "journal" => row["primary_location"]["source"]["display_name"],
        "journal_abbreviation" => journal_abbreviation,
        "biblio" => row["biblio"]
    )
end

function export_data(df::DataFrame)
    author_pub_list = [extract_info(row) for row in eachrow(df)]
    # open("../_data/publications/full_list_openalex.yaml", "w+") do f
    open("full_list_openalex.yaml", "w+") do f
        for yaml_obj in author_pub_list
            write(f, YAML.dump([yaml_obj], default_flow_style=false, sort_keys=false))
            write(f, "\n")
        end
    end
end

function main()
    if length(ARGS) != 1
        println("Usage: julia ExtractPubli.jl <input_parameter>")
        exit(1)
    end

    input_parameter = ARGS[1]
    println("Input Parameter: $input_parameter")

    openalex_id = get_openalex_id(input_parameter)
    df = df_creation(openalex_id)
    println(openalex_id)
    println("Number of records: $(nrow(df))")

    export_data(df)
end

if abspath(PROGRAM_FILE) == @__FILE__
    main()
end
