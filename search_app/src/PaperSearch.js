import {Button, Col, Container, Dropdown, Form, Navbar, Row, Spinner, Table} from "react-bootstrap";
import {useFormik} from "formik";
import {useEffect, useState} from "react";


async function FetchReadingList(set_reading_list) {
    const response = await fetch('http://127.0.0.1:5000/api/v1/reading_list', {method: 'GET'})

    try {
        if (response.ok) {
            const response_data = await response.json();
            set_reading_list(response_data)
        }
    } catch (err) {
        set_reading_list([])
    }


}


async function AddItemToReadingList(title, paper_url, set_reading_list) {

    const response = await fetch('http://127.0.0.1:5000/api/v1/reading_list', {
        method: 'POST', body: JSON.stringify({
            title: title,
            paper_url: paper_url
        }),
        headers: {"Content-Type": "application/json"}
    })

    try {
        if (response.ok) {

            FetchReadingList(set_reading_list)

        }
    } catch (err) {

    }

}

export function PaperSearchPage() {

    const [search_results, set_search_results] = useState([])
    const [reading_list, set_reading_list] = useState([])

    useEffect(() => {
        FetchReadingList(set_reading_list)
    }, [])


    return (


        <Container>

            <Row style={{position: "sticky", top: 0, zIndex: 1020, backgroundColor: "white"}}>
                <Col>
                    <SearchBox set_search_results={set_search_results}></SearchBox>
                </Col>

                <Col>
                    <ReadingListDropdown reading_list={reading_list}></ReadingListDropdown>
                </Col>

                <Row className={"mt-2"}>
                    <ResultCounter result_count={search_results.length}></ResultCounter>
                </Row>
            </Row>


            <Row className={"mt-2"}>
                <SearchResultTable search_results={search_results}
                                   set_reading_list={set_reading_list}></SearchResultTable>
            </Row>
        </Container>
    )

}


async function FetchSearchResults(search_term, set_search_results, set_submission_state) {


    if (search_term == undefined) {

        set_search_results([])
    }

    set_submission_state("submitting")

    const response = await fetch(`http://127.0.0.1:5000/api/v1/search?search_term=${search_term}`, {method: 'GET'})

    try {
        if (response.ok) {
            const response_data = await response.json();
            set_submission_state()
            set_search_results(response_data)
        }
    } catch (err) {
        set_submission_state()
        set_search_results([])
    }
}


function SearchBox(props) {

    const {set_search_results} = props
    const [submission_state, set_submission_state] = useState()

    const formik = useFormik({
        initialValues: {
            search_term: "",
        },
        onSubmit: values => {
            FetchSearchResults(values.search_term, set_search_results, set_submission_state)
        }

    });

    return (
        <Form onSubmit={formik.handleSubmit}>
            <label htmlFor="search_term"></label>
            <input id={"search_term"} name={"search_term"} type="search_term"
                   onChange={formik.handleChange} value={formik.values.search_term}/>

            {submission_state === "submitting" ?
                <Spinner animation={"border"} className={"ms-1"} size={"sm"}/> :
                <Button variant={"primary"} type={"submit"} className={"ms-1"}>Search</Button>
            }

        </Form>
    )

}

function ResultCounter(props) {

    const {result_count} = props


    if (result_count === 1) {
        return <div> 1 Result Has Been Found</div>
    }
    return (<div>{result_count} Results Have Been Found</div>)
}


function AddReadingListItemButton(props) {
    const {set_reading_list} = props
    const {item_title} = props
    const {item_url} = props

    return (
        <Button variant={"secondary"} onClick={() => {
            AddItemToReadingList(item_title, item_url, set_reading_list)
        }}>Add</Button>
    )


}

function SearchResultRow(props) {

    const {set_reading_list} = props
    const {search_result} = props
    const {title} = search_result
    const {publish_date} = search_result
    const {journal} = search_result
    const {authors} = search_result
    const {paper_url} = search_result


    return (
        <tr>
            <td>
                <a href={paper_url} target={"_blank"}>{title}</a>
            </td>

            <td>
                {publish_date}
            </td>

            <td>
                {journal}
            </td>

            <td>
                {authors}
            </td>

            <td>
                <AddReadingListItemButton set_reading_list={set_reading_list} item_title={title} item_url={paper_url}/>
            </td>
        </tr>
    )

}


function SearchResultTable(props) {

    const {search_results} = props
    const {set_reading_list} = props


    const table_rows = search_results.map((search_result) => {
        return <SearchResultRow key={search_result.id} search_result={search_result}
                                set_reading_list={set_reading_list}></SearchResultRow>
    })


    return (
        <Table striped bordered hover size={"sm"}>
            <thead>
            <tr>
                <th>Title</th>
                <th>Publish Date</th>
                <th>Journal</th>
                <th>Authors</th>
            </tr>

            </thead>

            <tbody>
            {table_rows}
            </tbody>

        </Table>
    )
}

function ReadingListDropdown(props) {

    const {reading_list} = props


    const menu_items = reading_list.map(reading_list_item => {
        return <Dropdown.Item href={reading_list_item.paper_url} data-testid={`Dropdown Row ${reading_list_item.id}`}
                              target={"_blank"} key={reading_list_item.id}>{reading_list_item.title}</Dropdown.Item>
    })

    return (

        <Dropdown>
            <Dropdown.Toggle id={"dropdown-basic"}>
                Reading List ({(reading_list.length)})
            </Dropdown.Toggle>

            <Dropdown.Menu>
                {menu_items}
            </Dropdown.Menu>
        </Dropdown>

    )

}